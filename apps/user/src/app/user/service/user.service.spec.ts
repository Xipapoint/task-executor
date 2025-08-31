import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { ConflictException } from '@nestjs/common';
import { UserService } from '../service/user.service';
import { User } from '../entities/user.entity';

describe('UserService', () => {
  let service: UserService;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockRepository,
        },
      ],
    }).compile();

    service = module.get<UserService>(UserService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findById', () => {
    it('should return a user when found', async () => {
      const userId = 'user-id';
      const user = { id: userId, email: 'test@example.com' };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findById(userId);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { id: userId } });
    });

    it('should return null when user not found', async () => {
      mockRepository.findOne.mockResolvedValue(null);

      const result = await service.findById('non-existent-id');

      expect(result).toBeNull();
    });
  });

  describe('findByEmail', () => {
    it('should return a user when found', async () => {
      const email = 'test@example.com';
      const user = { id: 'user-id', email };
      mockRepository.findOne.mockResolvedValue(user);

      const result = await service.findByEmail(email);

      expect(result).toEqual(user);
      expect(mockRepository.findOne).toHaveBeenCalledWith({ where: { email } });
    });
  });

  describe('createUser', () => {
    it('should create a new user successfully', async () => {
      const userData = {
        email: 'test@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      
      mockRepository.findOne.mockResolvedValue(null); // User doesn't exist
      mockRepository.create.mockReturnValue(userData);
      mockRepository.save.mockResolvedValue({ ...userData, id: 'user-id' });

      const result = await service.createUser(userData);

      expect(result).toEqual({ ...userData, id: 'user-id' });
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...userData,
        password: expect.any(String), // Password should be hashed
      });
    });

    it('should throw ConflictException when user already exists', async () => {
      const userData = {
        email: 'existing@example.com',
        password: 'password',
        firstName: 'John',
        lastName: 'Doe',
      };
      
      mockRepository.findOne.mockResolvedValue({ id: 'existing-id' }); // User exists

      await expect(service.createUser(userData)).rejects.toThrow(ConflictException);
    });
  });
});
